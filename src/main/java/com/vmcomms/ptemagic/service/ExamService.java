package com.vmcomms.ptemagic.service;

import com.vmcomms.ptemagic.service.dto.ExamDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service Interface for managing Exam.
 */
public interface ExamService {

    /**
     * Save a exam.
     *
     * @param examDTO the entity to save
     * @return the persisted entity
     */
    ExamDTO save(ExamDTO examDTO);

    /**
     *  Get all the exams.
     *
     *  @param pageable the pagination information
     *  @return the list of entities
     */
    Page<ExamDTO> findAll(Pageable pageable);

    /**
     *  Get the "id" exam.
     *
     *  @param id the id of the entity
     *  @return the entity
     */
    ExamDTO findOne(Long id);

    /**
     *  Delete the "id" exam.
     *
     *  @param id the id of the entity
     */
    void delete(Long id);
}
