package com.vmcomms.ptemagic.web.rest;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codahale.metrics.annotation.Timed;
import com.vmcomms.ptemagic.service.ExamTypeService;
import com.vmcomms.ptemagic.service.dto.ExamTypeDTO;
import com.vmcomms.ptemagic.web.rest.errors.BadRequestAlertException;
import com.vmcomms.ptemagic.web.rest.util.HeaderUtil;
import com.vmcomms.ptemagic.web.rest.util.PaginationUtil;

import io.github.jhipster.web.util.ResponseUtil;
import io.swagger.annotations.ApiParam;

/**
 * REST controller for managing ExamType.
 */
@RestController
@RequestMapping("/api")
public class ExamTypeResource extends AbstractPteResource {

    private final Logger log = LoggerFactory.getLogger(ExamTypeResource.class);

    private static final String ENTITY_NAME = "examType";

    @Autowired
    private ExamTypeService examTypeService;
    
    /**
     * POST  /exam-types : Create a new examType.
     *
     * @param examTypeDTO the examTypeDTO to create
     * @return the ResponseEntity with status 201 (Created) and with body the new examTypeDTO, or with status 400 (Bad Request) if the examType has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/exam-types")
    @Timed
    public ResponseEntity<ExamTypeDTO> createExamType(@Valid @RequestBody ExamTypeDTO examTypeDTO) throws URISyntaxException {
        log.debug("REST request to save ExamType : {}", examTypeDTO);
        if (examTypeDTO.getId() != null) {
            throw new BadRequestAlertException("A new examType cannot already have an ID", ENTITY_NAME, "idexists");
        }
        ExamTypeDTO result = examTypeService.save(examTypeDTO);
        return ResponseEntity.created(new URI("/api/exam-types/" + result.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
            .body(result);
    }

    /**
     * PUT  /exam-types : Updates an existing examType.
     *
     * @param examTypeDTO the examTypeDTO to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated examTypeDTO,
     * or with status 400 (Bad Request) if the examTypeDTO is not valid,
     * or with status 500 (Internal Server Error) if the examTypeDTO couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/exam-types")
    @Timed
    public ResponseEntity<ExamTypeDTO> updateExamType(@Valid @RequestBody ExamTypeDTO examTypeDTO) throws URISyntaxException {
        log.debug("REST request to update ExamType : {}", examTypeDTO);
        if (examTypeDTO.getId() == null) {
            return createExamType(examTypeDTO);
        }
        ExamTypeDTO result = examTypeService.save(examTypeDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, examTypeDTO.getId().toString()))
            .body(result);
    }

    /**
     * GET  /exam-types : get all the examTypes.
     *
     * @param pageable the pagination information
     * @return the ResponseEntity with status 200 (OK) and the list of examTypes in body
     */
    @GetMapping("/exam-types")
    @Timed
    public ResponseEntity<List<ExamTypeDTO>> getAllExamTypes(@ApiParam Pageable pageable) {
        log.debug("REST request to get a page of ExamTypes");
        Page<ExamTypeDTO> page = examTypeService.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/exam-types");
        return new ResponseEntity<>(page.getContent(), headers, HttpStatus.OK);
    }
    
    @GetMapping("/get-exam-by-types/{type}")
    @Timed
    public ResponseEntity<List<ExamTypeDTO>> getAllExamTypesByType(@PathVariable String type) {
        log.debug("REST request to getAllExamTypesByType");

        List<ExamTypeDTO> data = examTypeService.getAllExamTypesByType(type, getCurrentUserId());
//        if (TestType.MOCK_TEST_A.equals(type) || TestType.MOCK_TEST_B.equals(type) || TestType.MOCK_TEST_FULL.equals(type)) {
//        	for (ExamTypeDTO examTypeDTO : data) {
//    			// Update exam.remainTest
//            	Integer remainTest = userLimitExamService.getRemainTest(userDTO.getId(), examTypeDTO.getId());
//            	examTypeDTO.setRemainTest(remainTest);
//    		}
//        }
        
        return new ResponseEntity<>(data, HttpStatus.OK);
    }
    
    @GetMapping("/get-all-mock-exam")
    @Timed
    public ResponseEntity<List<ExamTypeDTO>> getAllExamTypesByType() {
        log.debug("REST request to getAllExamTypesByType");
        
        List<ExamTypeDTO> dataA = examTypeService.getAllExamTypesByType("MOCK_TEST_A", getCurrentUserId());
        List<ExamTypeDTO> dataB = examTypeService.getAllExamTypesByType("MOCK_TEST_B", getCurrentUserId());
        List<ExamTypeDTO> dataFull = examTypeService.getAllExamTypesByType("MOCK_TEST_FULL", getCurrentUserId());
        
        List<ExamTypeDTO> result = new ArrayList<ExamTypeDTO>();
        if (dataA != null && dataA.size() > 0) {
        	result.addAll(dataA);
        }
        if (dataB != null && dataB.size() > 0) {
        	result.addAll(dataB);
        }
        if (dataFull != null && dataFull.size() > 0) {
        	result.addAll(dataFull);
        }
        
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    /**
     * GET  /exam-types/:id : get the "id" examType.
     *
     * @param id the id of the examTypeDTO to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the examTypeDTO, or with status 404 (Not Found)
     */
    @GetMapping("/exam-types/{id}")
    @Timed
    public ResponseEntity<ExamTypeDTO> getExamType(@PathVariable Long id) {
        log.debug("REST request to get ExamType : {}", id);
        ExamTypeDTO examTypeDTO = examTypeService.findOne(id);
        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(examTypeDTO));
    }

    /**
     * DELETE  /exam-types/:id : delete the "id" examType.
     *
     * @param id the id of the examTypeDTO to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/exam-types/{id}")
    @Timed
    public ResponseEntity<Void> deleteExamType(@PathVariable Long id) {
        log.debug("REST request to delete ExamType : {}", id);
        examTypeService.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }
}
