package com.vmcomms.ptemagic.service.impl;

import com.vmcomms.ptemagic.service.AnswerService;
import com.vmcomms.ptemagic.domain.Answer;
import com.vmcomms.ptemagic.repository.AnswerRepository;
import com.vmcomms.ptemagic.service.dto.AnswerDTO;
import com.vmcomms.ptemagic.service.mapper.AnswerMapper;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


/**
 * Service Implementation for managing Answer.
 */
@Service
@Transactional
@CacheConfig(cacheNames = "exam")
public class AnswerServiceImpl implements AnswerService{

    private final Logger log = LoggerFactory.getLogger(AnswerServiceImpl.class);

    private final AnswerRepository answerRepository;

    private final AnswerMapper answerMapper;

    public AnswerServiceImpl(AnswerRepository answerRepository, AnswerMapper answerMapper) {
        this.answerRepository = answerRepository;
        this.answerMapper = answerMapper;
    }

    /**
     * Save a answer.
     *
     * @param answerDTO the entity to save
     * @return the persisted entity
     */
    @Override
    public AnswerDTO save(AnswerDTO answerDTO) {
        log.debug("Request to save Answer : {}", answerDTO);
        Answer answer = answerMapper.toEntity(answerDTO);
        answer = answerRepository.save(answer);
        return answerMapper.toDto(answer);
    }

    /**
     *  Get all the answers.
     *
     *  @param pageable the pagination information
     *  @return the list of entities
     */
    @Override
    @Transactional(readOnly = true)
    public Page<AnswerDTO> findAll(Pageable pageable) {
        log.debug("Request to get all Answers");
        return answerRepository.findAll(pageable)
            .map(answerMapper::toDto);
    }

    /**
     *  Get one answer by id.
     *
     *  @param id the id of the entity
     *  @return the entity
     */
    @Override
    @Transactional(readOnly = true)
    public AnswerDTO findOne(Long id) {
        log.debug("Request to get Answer : {}", id);
        Answer answer = answerRepository.findOne(id);
        return answerMapper.toDto(answer);
    }

    /**
     *  Delete the  answer by id.
     *
     *  @param id the id of the entity
     */
    @Override
    public void delete(Long id) {
        log.debug("Request to delete Answer : {}", id);
        answerRepository.delete(id);
    }

	@Override
	@Cacheable
	public AnswerDTO findOneByExamIdAndQuestionId(Long examId, Long questionId) {
		log.debug("Request to delete findOneByExamIdAndQuestionId : examId {} questionId {}", examId, questionId);
		Answer answer = answerRepository.findOneByExamIdAndQuestionId(examId, questionId);
		return answerMapper.toDto(answer);
	}

	@Override
	public List<AnswerDTO> findByExamId(Long examId) {
		log.debug("Request to delete findByExamId : examId {}", examId);
		List<Answer> answers = answerRepository.findByExamId(examId);
		return answerMapper.toDto(answers);
	}
}
